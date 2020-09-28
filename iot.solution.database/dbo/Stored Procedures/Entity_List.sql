/*******************************************************************
DECLARE @count INT
     	,@output INT = 0
		,@fieldName	VARCHAR(255)

EXEC [dbo].[Entity_List]
	 @companyGuid	= 'AB469212-2488-49AD-BC94-B3A3F45590D2'
	,@pageSize		= 10
	,@pageNumber	= 1
	,@orderby		= NULL
	,@count			= @count OUTPUT
	,@invokingUser  = 'C1596B8C-7065-4D63-BFD0-4B835B93DFF2'
	,@version		= 'v1'
	,@output		= @output	OUTPUT
	,@fieldName		= @fieldName	OUTPUT

SELECT @count count, @output status, @fieldName fieldName

001 SEM-4	30-06-2020 [Nishit Khakhi]	Added initial version for Entity List
*******************************************************************/
CREATE PROCEDURE [dbo].[Entity_List]
(   @companyGuid		UNIQUEIDENTIFIER
	,@parentEntityGuid	UNIQUEIDENTIFIER	= NULL
	,@isParent			BIT					= NULL
	,@search			VARCHAR(100)		= NULL
	,@pageSize			INT
	,@pageNumber		INT
	,@orderby			VARCHAR(100)		= NULL
	,@invokingUser		UNIQUEIDENTIFIER
	,@version			VARCHAR(10)
	,@culture			VARCHAR(10)			= 'en-Us'
	,@output			SMALLINT			OUTPUT
	,@fieldName			VARCHAR(255)		OUTPUT
	,@count				INT					OUTPUT
	,@enableDebugInfo	CHAR(1)				= '0'
)
AS
BEGIN
    SET NOCOUNT ON

    IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'Entity_List' AS '@procName'
            	, CONVERT(VARCHAR(MAX),@companyGuid) AS '@companyGuid'
				, CONVERT(VARCHAR(MAX),@parentEntityGuid) AS '@parentEntityGuid'
				, CONVERT(VARCHAR(MAX),@isParent) AS '@isParent'
            	, CONVERT(VARCHAR(MAX),@search) AS '@search'
				, CONVERT(VARCHAR(MAX),@pageSize) AS '@pageSize'
				, CONVERT(VARCHAR(MAX),@pageNumber) AS '@pageNumber'
				, CONVERT(VARCHAR(MAX),@orderby) AS '@orderby'
				, CONVERT(VARCHAR(MAX),@version) AS '@version'
            	, CONVERT(VARCHAR(MAX),@invokingUser) AS '@invokingUser'
            FOR XML PATH('Params')
	    )
	    INSERT INTO DebugInfo(data, dt) VALUES(Convert(VARCHAR(MAX), @Param), GETDATE())
    END
    
    BEGIN TRY

		SET	@output = 1
		SET @count = -1

		IF OBJECT_ID('tempdb..#temp_Entity') IS NOT NULL DROP TABLE #temp_Entity
		IF OBJECT_ID('tempdb..#temp_ListEntity') IS NOT NULL DROP TABLE #temp_ListEntity
		IF OBJECT_ID('tempdb..#temp_AvgAttributeValue') IS NOT NULL DROP TABLE #temp_AvgAttributeValue

		CREATE TABLE #temp_Entity
		(	[guid]						UNIQUEIDENTIFIER
			,[parentEntityGuid]			UNIQUEIDENTIFIER
			,[name]						NVARCHAR(500)
			,[type]						NVARCHAR(100)
			,[description]				NVARCHAR(1000)
			,[address]					NVARCHAR(500)
			,[address2]					NVARCHAR(500)
			,[city]						NVARCHAR(50)
			,[zipCode]					NVARCHAR(10)
			,[stateGuid]				UNIQUEIDENTIFIER NULL
			,[countryGuid]				UNIQUEIDENTIFIER NULL
			,[image]					NVARCHAR(250)
			,[latitude]					NVARCHAR(50)
			,[longitude]				NVARCHAR(50)
			,[isActive]					BIT
			,[totalDevices]				BIGINT
			,[totalSubEntities]			BIGINT
			,[totalAlerts]				BIGINT
			,[rowNum]					INT
		)

		IF LEN(ISNULL(@orderby, '')) = 0
		SET @orderby = 'name asc'

		DECLARE @Sql nvarchar(MAX) = ''

		SET @Sql = '
		
		SELECT
			*
			,ROW_NUMBER() OVER (ORDER BY '+@orderby+') AS rowNum
		FROM
		(
			SELECT
			L.[guid]
			, L.[parentEntityGuid]
			, L.[name]
			, L.[type]
			, L.[description]
			, L.[address] 
			, L.[address2] AS address2
			, L.[city]
			, L.[zipCode]
			, L.[stateGuid]
			, L.[countryGuid]
			, L.[image]
			, L.[latitude]
			, L.[longitude]
			, L.[isActive]	
			, 0 AS [totalDevices]	
			, 0 AS [totalSubEntities]	
			, 0 AS [totalAlerts]	
			FROM [dbo].[Entity] AS L WITH (NOLOCK) 
			 WHERE L.[companyGuid]=@companyGuid AND L.[isDeleted]=0 '
			  + ' and L.Guid not in (select entityGuid from [dbo].[Company] where [Guid]=@companyGuid) '
			 + CASE WHEN @parentEntityGuid IS NOT NULL THEN ' AND L.[parentEntityGuid] = @parentEntityGuid ' ELSE ' AND L.[parentEntityGuid] IS NULL ' END +
			 + CASE WHEN @isParent = 1 THEN ' AND L.[parentEntityGuid] IS NULL ' ELSE ' ' END +
			+ CASE WHEN @search IS NULL THEN '' ELSE
			' AND (L.name LIKE ''%' + @search + '%''
			  OR L.address LIKE ''%' + @search + '%''
			  OR L.address2 LIKE ''%' + @search + '%''
			  OR L.zipCode LIKE ''%' + @search + '%''
			)'
			 END +
		' )  data '
		
		INSERT INTO #temp_Entity
		EXEC sp_executesql 
			  @Sql
			, N'@orderby VARCHAR(100), @companyGuid UNIQUEIDENTIFIER, @parentEntityGuid UNIQUEIDENTIFIER '
			, @orderby		= @orderby			
			, @companyGuid	= @companyGuid			
			, @parentEntityGuid	= @parentEntityGuid
		SET @count = @@ROWCOUNT
		
		;WITH CTEEntity AS
		(	SELECT E.[guid], E.[name], CAST(NULL AS UNIQUEIDENTIFIER) [parentEntityGuid]
			FROM dbo.[Entity] E (NOLOCK)
			INNER JOIN #temp_Entity T ON E.[guid] = T.[guid]

			UNION ALL

			SELECT c.[guid], c.[name], c.[parentEntityGuid]
			FROM dbo.[Entity] c (NOLOCK)
			INNER JOIN CTEEntity p ON c.[parentEntityGuid] = p.[guid] AND c.[isDeleted] = 0
		)

		SELECT * INTO #temp_ListEntity FROM  CTEEntity;

		;with CTE
		AS (
			SELECT L.[guid],COUNT(G.[guid]) [totalCount]
			FROM [dbo].[Device] G (NOLOCK)
			INNER JOIN #temp_Entity L ON G.[entityGuid] = L.[guid]
			WHERE G.[isDeleted] = 0
			GROUP BY L.[guid]
		)
		, CTE_Child 
		AS	(
			SELECT L.[parentEntityGuid],COUNT(G.[guid]) [totalCount]
			FROM [dbo].[Device] G (NOLOCK)
			INNER JOIN #temp_ListEntity L ON G.[entityGuid] = L.[guid] 
			WHERE G.[isDeleted] = 0
			GROUP BY L.[parentEntityGuid]
		)
		, CTE_Zone
		AS
		(	SELECT GH.[guid], COUNT(E.[guid]) AS [totalCount] 
			FROM [dbo].[Entity] E (NOLOCK)
			INNER JOIN #temp_Entity GH ON E.[parentEntityGuid] = GH.[guid]
			WHERE E.[companyGuid] = @companyGuid AND E.[isActive] = 1 AND E.[isDeleted] = 0
			GROUP BY GH.[guid]
		)
		, CTE_Alerts
		AS (	SELECT E.[parentEntityGuid], COUNT(I.[guid]) AS [totalAlert]
				FROM [dbo].[IOTConnectAlert] I (NOLOCK)
				INNER JOIN #temp_ListEntity E ON I.[entityGuid] = E.[guid]
				WHERE I.[companyGuid] = @companyGuid AND MONTH([eventDate]) = MONTH(GETUTCDATE()) AND YEAR([eventDate]) = YEAR(GETUTCDATE())
				GROUP BY E.[parentEntityGuid]
		)
		UPDATE L
		SET [totalDevices]	= ISNULL(CC.[totalCount],0) + ISNULL(C.[totalCount],0) 
			, [totalSubEntities]	= ISNULL(CW.[totalCount],0)
			,[totalAlerts] = ISNULL(A.[totalAlert],0)   
		FROM #temp_Entity L
		LEFT JOIN CTE C ON L.[guid] = C.[guid]
		LEFT JOIN CTE_Zone CW ON L.[guid] = CW.[guid]
		LEFT JOIN CTE_Child CC ON L.[guid] = CC.[parentEntityGuid]
		LEFT JOIN CTE_Alerts A ON L.[guid] = A.[parentEntityGuid]
		
		-- #temp_AvgAttributeValue --dbo.[KitTypeAttribute]

		IF(@pageSize <> -1 AND @pageNumber <> -1)
			BEGIN
				SELECT 
					L.[guid]
					, L.[parentEntityGuid]
					, L.[name]
					, L.[type]
					, L.[description]
					, L.[address] 
					, L.[address2] AS address2
					, L.[city]
					, L.[zipCode]
					, L.[stateGuid]
					, L.[countryGuid]
					, L.[image]
					, L.[latitude]
					, L.[longitude]
					, L.[isActive]
					, L.[totalDevices]	
					, L.[totalSubEntities]
					, L.[totalAlerts]
				FROM #temp_Entity L
				WHERE rowNum BETWEEN ((@pageNumber - 1) * @pageSize) + 1 AND (@pageSize * @pageNumber)			
			END
		ELSE
			BEGIN
				SELECT 
				L.[guid]
					, L.[parentEntityGuid]
					, L.[name]
					, L.[type]
					, L.[description]
					, L.[address] 
					, L.[address2] AS address2
					, L.[city]
					, L.[zipCode]
					, L.[stateGuid]
					, L.[countryGuid]
					, L.[image]
					, L.[latitude]
					, L.[longitude]
					, L.[isActive]
					, L.[totalDevices]	
					, L.[totalSubEntities]
					, L.[totalAlerts]
				FROM #temp_Entity L
			END
	   
        SET @output = 1
		SET @fieldName = 'Success'
	END TRY	
	BEGIN CATCH	
		DECLARE @errorReturnMessage VARCHAR(MAX)

		SET @output = 0

		SELECT @errorReturnMessage = 
			ISNULL(@errorReturnMessage, '') +  SPACE(1)   + 
			'ErrorNumber:'  + ISNULL(CAST(ERROR_NUMBER() as VARCHAR), '')  + 
			'ErrorSeverity:'  + ISNULL(CAST(ERROR_SEVERITY() as VARCHAR), '') + 
			'ErrorState:'  + ISNULL(CAST(ERROR_STATE() as VARCHAR), '') + 
			'ErrorLine:'  + ISNULL(CAST(ERROR_LINE () as VARCHAR), '') + 
			'ErrorProcedure:'  + ISNULL(CAST(ERROR_PROCEDURE() as VARCHAR), '') + 
			'ErrorMessage:'  + ISNULL(CAST(ERROR_MESSAGE() as VARCHAR(max)), '')
		RAISERROR (@errorReturnMessage, 11, 1)  
 
		IF (XACT_STATE()) = -1  
		BEGIN   
			ROLLBACK TRANSACTION 
		END   
		IF (XACT_STATE()) = 1  
		BEGIN      
			ROLLBACK TRANSACTION  
		END   
		RAISERROR (@errorReturnMessage, 11, 1)   
	END CATCH
END